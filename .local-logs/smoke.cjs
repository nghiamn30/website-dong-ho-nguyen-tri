// Phase-1 genealogy API smoke test against the in-memory backend.
const BASE = 'http://localhost:3001/api';
let cookie = '';
let pass = 0;
let fail = 0;

function ok(name, cond, extra) {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${name}${extra ? ' :: ' + extra : ''}`);
  }
}

async function call(method, path, body, expectStatus) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (expectStatus && res.status !== expectStatus) {
    console.log(`   (status ${res.status} != ${expectStatus}) ${path} -> ${text.slice(0, 200)}`);
  }
  return { status: res.status, data };
}

(async () => {
  // 1. Login
  const login = await call('POST', '/auth/login', {
    employeeCode: 'ADMIN001',
    password: 'admin123',
  });
  ok('login as ADMIN001', login.status === 201 || login.status === 200, `status ${login.status}`);
  ok('auth cookie captured', cookie.length > 0);

  // 2. Configure clan
  const clan = await call('PUT', '/genealogy/clan', {
    name: 'Dòng họ Nguyễn Trí',
    description: 'Thử nghiệm giai đoạn 1',
  });
  ok('create/update clan', clan.status === 200 && clan.data.singletonKey === true, `status ${clan.status}`);

  // 3. Create persons
  const founder = await call('POST', '/genealogy/persons', {
    fullName: 'Nguyễn Trí Thủy Tổ',
    gender: 'MALE',
    generationNumber: 1,
  });
  ok('create founder (MALE)', founder.status === 201 && founder.data.gender === 'MALE');

  const wife = await call('POST', '/genealogy/persons', {
    fullName: 'Bà Thủy Tổ',
    gender: 'FEMALE',
    generationNumber: 1,
    isClanMember: false,
  });
  ok('create wife (FEMALE, dâu)', wife.status === 201 && wife.data.isClanMember === false);

  const son = await call('POST', '/genealogy/persons', {
    fullName: 'Nguyễn Trí Con',
    gender: 'MALE',
    generationNumber: 2,
    birthSolarDate: '1980-03-15',
  });
  ok('create son (MALE, birth date)', son.status === 201 && son.data.birthSolarDate === '1980-03-15');
  ok('son birth source auto SOLAR', son.data.birthDateSource === 'SOLAR');

  // Reject gender missing
  const noGender = await call('POST', '/genealogy/persons', { fullName: 'Không giới tính' });
  ok('reject person without gender', noGender.status === 400);

  // Living with death data should be cleared
  const living = await call('POST', '/genealogy/persons', {
    fullName: 'Người Sống',
    gender: 'FEMALE',
    lifeStatus: 'LIVING',
    deathSolarDate: '2010-01-01',
  });
  ok('living person drops death data', living.status === 201 && !living.data.deathSolarDate);

  // 4. Set founder
  const withFounder = await call('PUT', '/genealogy/clan', {
    name: 'Dòng họ Nguyễn Trí',
    founderPersonId: founder.data.id,
  });
  ok('set clan founder', withFounder.status === 200 && withFounder.data.founderPersonId === founder.data.id);

  // 5. Marriage
  const marriage = await call('POST', '/genealogy/marriages', {
    husbandPersonId: founder.data.id,
    wifePersonId: wife.data.id,
  });
  ok('create marriage', marriage.status === 201 && marriage.data.status === 'ACTIVE');

  const badMarriage = await call('POST', '/genealogy/marriages', {
    husbandPersonId: wife.data.id, // female as husband
    wifePersonId: founder.data.id,
  });
  ok('reject marriage with female husband', badMarriage.status === 400);

  // 6. Parent-child
  const fatherRel = await call('POST', '/genealogy/parent-child', {
    parentPersonId: founder.data.id,
    childPersonId: son.data.id,
    parentRole: 'FATHER',
  });
  ok('attach father -> son', fatherRel.status === 201);

  const motherRel = await call('POST', '/genealogy/parent-child', {
    parentPersonId: wife.data.id,
    childPersonId: son.data.id,
    parentRole: 'MOTHER',
  });
  ok('attach mother -> son', motherRel.status === 201);

  const femaleFather = await call('POST', '/genealogy/parent-child', {
    parentPersonId: wife.data.id,
    childPersonId: son.data.id,
    parentRole: 'FATHER',
  });
  ok('reject female as FATHER', femaleFather.status === 400);

  const cycle = await call('POST', '/genealogy/parent-child', {
    parentPersonId: son.data.id,
    childPersonId: founder.data.id,
    parentRole: 'FATHER',
  });
  ok('reject ancestry cycle', cycle.status === 400);

  // 7. Branch + leadership
  const branch = await call('POST', '/genealogy/branches', {
    name: 'Chi Trưởng',
    type: 'Chi',
  });
  ok('create branch', branch.status === 201);

  // Put founder + son in branch
  await call('PATCH', `/genealogy/persons/${founder.data.id}`, {
    fullName: 'Nguyễn Trí Thủy Tổ',
    gender: 'MALE',
    branchId: branch.data.id,
  });
  await call('PATCH', `/genealogy/persons/${son.data.id}`, {
    fullName: 'Nguyễn Trí Con',
    gender: 'MALE',
    branchId: branch.data.id,
    birthSolarDate: '1980-03-15',
  });

  const setHead = await call('POST', `/genealogy/branches/${branch.data.id}/transfer-leadership`, {
    successorPersonId: founder.data.id,
  });
  ok('set initial branch head', setHead.status === 201 && setHead.data.headPersonId === founder.data.id);

  const autoHead = await call('POST', `/genealogy/branches/${branch.data.id}/transfer-leadership`, {});
  ok('auto transfer to senior son', autoHead.status === 201 && autoHead.data.headPersonId === son.data.id);

  const history = await call('GET', `/genealogy/branches/${branch.data.id}/leadership-history`);
  ok('leadership history recorded', Array.isArray(history.data) && history.data.length >= 2);

  // 8. Family tree
  const tree = await call('GET', '/genealogy/family-tree');
  const root = tree.data?.nodes?.[0];
  ok('family tree root is founder', tree.data.rootPersonId === founder.data.id);
  ok('family tree shows spouse', root && root.spouses.some((s) => s.person.id === wife.data.id));
  ok('family tree shows child', root && root.children.some((c) => c.person.id === son.data.id));

  // 9. Search + relations + reads are not permission gated (GET works with auth)
  const search = await call('GET', '/genealogy/persons?search=Con');
  ok('search persons by name', Array.isArray(search.data) && search.data.some((p) => p.id === son.data.id));

  const relations = await call('GET', `/genealogy/persons/${son.data.id}/relations`);
  ok('person relations parents', relations.data.parents.length === 2);

  // 10. Delete protection
  const del = await call('DELETE', `/genealogy/persons/${founder.data.id}`);
  ok('block deleting referenced person', del.status === 409);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
})().catch((error) => {
  console.error('SMOKE ERROR', error);
  process.exit(1);
});
