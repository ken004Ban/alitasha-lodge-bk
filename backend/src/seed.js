const seedData = async (supabase) => {
  console.log('🌱 Seeding Alitasha Lodge Demo Data...');

  // ─── Clean up old branches if they exist ───────────────────────────────
  const oldNames = ['Kasama Main', 'Lusaka Branch', 'Ndola Branch'];
  for (const name of oldNames) {
    const { error } = await supabase.from('branches').delete().eq('name', name);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows matched — expected if already cleaned
      console.warn('⚠️ Could not delete old branch:', name, error.message);
    }
  }

  // ─── Seed Branches (Kasama, Mansa, Mpika) ─────────────────────────────
  const { data: branches, error: branchErr } = await supabase.from('branches').select('id, name');
  if (branchErr) {
    console.error('❌ branches read failed:', branchErr.message);
    return;
  }

  if (!branches?.length) {
    const { error } = await supabase.from('branches').insert([
      { name: 'Kasama', location: 'Kasama, Zambia', accepting_bookings: true },
      { name: 'Mansa', location: 'Mansa, Zambia', accepting_bookings: true },
      { name: 'Mpika', location: 'Mpika, Zambia', accepting_bookings: true },
    ]);
    if (error) {
      console.error('❌ Branch seed failed:', error.message);
      return;
    }
    console.log('✅ Branches seeded: Kasama, Mansa, Mpika');
  } else {
    console.log(`ℹ️  Found ${branches.length} existing branches, skipping branch insert.`);
  }

  const { data: branchRows } = await supabase.from('branches').select('id, name');
  const branchMap = Object.fromEntries((branchRows || []).map((b) => [b.name, b.id]));

  // ─── Seed Rooms with Kwacha prices and real room numbers ───────────────
  const roomConfig = {
    Kasama: [
      { room_number: '101', room_type: 'Deluxe Suite', price_per_night: 2500, description: 'Spacious suite overlooking Kasama hills', availability: true },
      { room_number: '102', room_type: 'Executive Room', price_per_night: 3500, description: 'Premium room with lake views', availability: true },
      { room_number: '103', room_type: 'Standard Double', price_per_night: 1500, description: 'Comfortable room with garden access', availability: true },
    ],
    Mansa: [
      { room_number: '201', room_type: 'Garden View Suite', price_per_night: 2000, description: 'Tranquil suite opening to tropical gardens', availability: true },
      { room_number: '202', room_type: 'Executive Room', price_per_night: 3000, description: 'Modern room for business travellers', availability: true },
      { room_number: '203', room_type: 'Standard Single', price_per_night: 1100, description: 'Cozy budget-friendly room', availability: true },
    ],
    Mpika: [
      { room_number: '301', room_type: 'Safari Suite', price_per_night: 2800, description: 'Adventure-themed suite near wildlife reserves', availability: true },
      { room_number: '302', room_type: 'Family Room', price_per_night: 3200, description: 'Large room sleeping up to 4 guests', availability: true },
      { room_number: '303', room_type: 'Standard Double', price_per_night: 1300, description: 'Simple comfortable stay', availability: true },
    ],
  };

  for (const [branchName, templates] of Object.entries(roomConfig)) {
    const branchId = branchMap[branchName];
    if (!branchId) {
      console.warn(`⚠️  No branch ID for "${branchName}", skipping rooms.`);
      continue;
    }
    const { count, error: countErr } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId);

    if (countErr) {
      console.error(`❌ Room count failed for ${branchName}:`, countErr.message);
      continue;
    }
    if ((count || 0) === 0) {
      const rows = templates.map((t) => ({ ...t, branch_id: branchId }));
      const { error } = await supabase.from('rooms').insert(rows);
      if (error) console.error(`❌ Rooms seed failed for ${branchName}:`, error.message);
      else console.log(`✅ Rooms seeded for ${branchName}`);
    }
  }

  // ─── Seed Visitor Logs (150+ entries with real country distribution) ──
  const { count: logCount } = await supabase
    .from('visitor_logs')
    .select('*', { count: 'exact', head: true });

  const branchIds = Object.values(branchMap);
  if ((logCount || 0) < 100 && branchIds.length) {
    const countries = ['Zambia', 'South Africa', 'United Kingdom', 'United States', 'Nigeria', 'Kenya', 'Germany', 'Canada', 'India'];
    const cityMap = {
      Zambia: ['Lusaka', 'Kasama', 'Mansa', 'Mpika', 'Ndola', 'Kitwe'],
      'South Africa': ['Johannesburg', 'Cape Town', 'Durban'],
      'United Kingdom': ['London', 'Manchester', 'Edinburgh'],
      'United States': ['New York', 'Chicago', 'Atlanta'],
      Nigeria: ['Lagos', 'Abuja'],
      Kenya: ['Nairobi', 'Mombasa'],
      Germany: ['Berlin', 'Munich'],
      Canada: ['Toronto', 'Vancouver'],
      India: ['Mumbai', 'Delhi'],
    };
    const browsers = ['Chrome 120', 'Chrome 121', 'Firefox 122', 'Safari 17', 'Edge 120'];
    const devices = ['desktop', 'mobile', 'tablet'];
    const pages = ['/', '/booking', '/rooms', '/amenities', '/admin', '/booking?branch=' + branchIds[0], '/booking?branch=' + branchIds[1], '/booking?branch=' + branchIds[2]];
    const target = 180 - (logCount || 0);

    const generateLogs = (includeBranchId) => {
      const logs = [];
      for (let i = 0; i < target; i++) {
        const country = countries[Math.floor(Math.random() * countries.length)];
        const cityArr = cityMap[country] || ['Unknown'];
        const branch_id = Math.random() < 0.75
          ? branchIds[Math.floor(Math.random() * branchIds.length)]
          : null;
        const entry = {
          page_path: pages[Math.floor(Math.random() * pages.length)],
          country,
          city: cityArr[Math.floor(Math.random() * cityArr.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          timestamp: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString(),
        };
        if (includeBranchId) entry.branch_id = branch_id;
        logs.push(entry);
      }
      return logs;
    };

    // Try with branch_id first; fall back to without if column is missing
    const logsWithBranch = generateLogs(true);
    const { error } = await supabase.from('visitor_logs').insert(logsWithBranch);

    if (error && error.message?.includes('branch_id')) {
      console.warn('⚠️  visitor_logs.branch_id column missing — retrying without it.');
      console.warn('   Run backend/migrations/001_visitor_logs_branch.sql to add it.');
      const logsWithoutBranch = generateLogs(false);
      const { error: retryErr } = await supabase.from('visitor_logs').insert(logsWithoutBranch);
      if (retryErr) console.error('❌ Visitor logs seed failed:', retryErr.message);
      else console.log(`✅ ${target} visitor logs seeded (no branch_id column)`);
    } else if (error) {
      console.error('❌ Visitor logs seed failed:', error.message);
    } else {
      console.log(`✅ ${target} visitor logs seeded`);
    }
  }

  // ─── Seed Realistic Bookings (60+ confirmed entries) ───────────────────
  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  const { data: rData } = await supabase.from('rooms').select('id, branch_id, room_type, price_per_night');
  if (!rData?.length) {
    console.error('❌ No rooms; skip booking seed');
    return;
  }

  if ((bookingCount || 0) < 50) {
    const customers = [
      { first: 'Chilufya', last: 'Banda', email: 'chilufya.banda' },
      { first: 'Mutale', last: 'Mulenga', email: 'mutale.mulenga' },
      { first: 'Bupe', last: 'Mwila', email: 'bupe.mwila' },
      { first: 'Kasonde', last: 'Phiri', email: 'kasonde.phiri' },
      { first: 'Martha', last: 'Tembo', email: 'martha.tembo' },
      { first: 'Peter', last: 'Zulu', email: 'peter.zulu' },
      { first: 'Alice', last: 'Mbewe', email: 'alice.mbewe' },
      { first: 'John', last: 'Banda', email: 'john.banda' },
      { first: 'Njavwa', last: 'Sichone', email: 'njavwa.sichone' },
      { first: 'Miyanda', last: 'Moono', email: 'miyanda.moono' },
      { first: 'Lushomo', last: 'Mweemba', email: 'lushomo.mweemba' },
      { first: 'Chanda', last: 'Kabwe', email: 'chanda.kabwe' },
      { first: 'Mwansa', last: 'Chisanga', email: 'mwansa.chisanga' },
      { first: 'Naomi', last: 'Mwanza', email: 'naomi.mwanza' },
      { first: 'Given', last: 'Lubinda', email: 'given.lubinda' },
      { first: 'Tamara', last: 'Chilala', email: 'tamara.chilala' },
      { first: 'Brian', last: 'Musonda', email: 'brian.musonda' },
      { first: 'Grace', last: 'Mkandawire', email: 'grace.mkandawire' },
      { first: 'Emmanuel', last: 'Mumba', email: 'emmanuel.mumba' },
      { first: 'Ruth', last: 'Kunda', email: 'ruth.kunda' },
      { first: 'Moffat', last: 'Simwaka', email: 'moffat.simwaka' },
      { first: 'Catherine', last: 'Nkhoma', email: 'catherine.nkhoma' },
      { first: 'Samuel', last: 'Mtonga', email: 'samuel.mtonga' },
      { first: 'Dorothy', last: 'Nyirenda', email: 'dorothy.nyirenda' },
      { first: 'Kelvin', last: 'Mkandawire', email: 'kelvin.mkandawire' },
    ];
    const statuses = ['confirmed', 'confirmed', 'confirmed', 'confirmed', 'cancelled', 'pending'];
    const toAdd = 75 - (bookingCount || 0);
    const dummyBookings = [];

    for (let i = 0; i < toAdd; i++) {
      const room = rData[Math.floor(Math.random() * rData.length)];
      const offsetDays = Math.floor(Math.random() * 90);
      const stay = 1 + Math.floor(Math.random() * 7);
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + offsetDays - 45);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + stay);
      const cust = customers[Math.floor(Math.random() * customers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      dummyBookings.push({
        branch_id: room.branch_id,
        room_id: room.id,
        customer_name: `${cust.first} ${cust.last}`,
        customer_email: `${cust.email}${i}@guest.alitasha.com`,
        customer_phone: `+260 97${String(Math.floor(700000 + Math.random() * 299999)).padStart(6, '0')}`,
        check_in_date: checkIn.toISOString().slice(0, 10),
        check_out_date: checkOut.toISOString().slice(0, 10),
        status,
      });
    }
    const { error } = await supabase.from('bookings').insert(dummyBookings);
    if (error) console.error('❌ Bookings seed failed:', error.message);
    else console.log(`✅ ${toAdd} bookings seeded with real customer data`);
  }
};

module.exports = { seedData };
