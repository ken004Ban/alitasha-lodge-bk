const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { seedData } = require('./seed');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- MIDDLEWARE ---
const checkSupabase = async (req, res, next) => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env' });
    }
    next();
};

app.use(checkSupabase);

// Run Seed Data on startup to ensure the demo always looks "alive"
const initDemoMode = async () => {
    try {
        await seedData(supabase);
    } catch (err) {
        console.error('❌ Seed data failed:', err);
    }
};
initDemoMode();

// --- ROUTES ---

// --- ROUTES ---

// 1. Visitor Tracking
app.post('/api/track', async (req, res) => {
    try {
        const { page_path, country, city, browser, device, branch_id } = req.body;

        const row = { page_path, country, city, browser, device };
        if (branch_id) row.branch_id = branch_id;

        const { error } = await supabase.from('visitor_logs').insert([row]);
        if (error) {
            console.warn('⚠️ Track insert failed:', error.message);
            return res.status(200).json({ success: false, note: 'tracking skipped' });
        }
        res.status(201).json({ success: true });
    } catch (err) {
        console.warn('⚠️ Track error:', err.message);
        res.status(200).json({ success: false, note: 'tracking skipped' });
    }
});

// 2. Bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const { limit, branch_id } = req.query;
        let query = supabase
            .from('bookings')
            .select('id, customer_name, customer_email, customer_phone, check_in_date, check_out_date, status, created_at, room_id, branch_id, rooms(room_number, room_type, price_per_night)')
            .order('created_at', { ascending: false });
        if (branch_id) query = query.eq('branch_id', branch_id);
        if (limit) query = query.limit(parseInt(limit));
        else query = query.limit(50);
        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

app.post('/api/bookings', async (req, res) => {
    const { branch_id, room_id, customer_name, customer_email, customer_phone, check_in_date, check_out_date } = req.body;

    const { data, error } = await supabase
        .from('bookings')
        .insert([{
            branch_id,
            room_id,
            customer_name,
            customer_email,
            customer_phone,
            check_in_date,
            check_out_date,
            status: 'confirmed',
        }]);

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ success: true, booking_id: data?.[0]?.id });
});

// 3. Analytics BI Endpoints
// When branch_id is set: visitors = logs for that branch OR global (branch_id IS NULL);
// bookings KPIs reflect only that branch. When unset: all branches.
app.get('/api/analytics/overview', async (req, res) => {
    const { branch_id } = req.query;

    let visitorCount = 0;
    let bookingCount = 0;
    let branchBookingCount = 0;

    if (branch_id) {
        const { count: v } = await supabase
            .from('visitor_logs')
            .select('*', { count: 'exact', head: true })
            .or(`branch_id.eq.${branch_id},branch_id.is.null`);
        visitorCount = v || 0;

        const { count: b } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branch_id);
        bookingCount = b || 0;
        branchBookingCount = b || 0;
    } else {
        const { count: v } = await supabase
            .from('visitor_logs')
            .select('*', { count: 'exact', head: true });
        visitorCount = v || 0;

        const { count: b } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });
        bookingCount = b || 0;
        branchBookingCount = 0;
    }

    const conversionRate =
        visitorCount > 0 ? ((bookingCount / visitorCount) * 100).toFixed(2) : '0.00';

    res.json({
        totalVisitors: visitorCount,
        totalBookings: bookingCount,
        conversionRate: `${conversionRate}%`,
        branchBookings: branchBookingCount,
    });
});

app.get('/api/analytics/branch-performance', async (req, res) => {
    const { branch_id } = req.query;

    let query = supabase.from('branches').select('id, name, bookings(count)');
    if (branch_id) query = query.eq('id', branch_id);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    const formattedData = (data || []).map((b) => ({
        name: b.name,
        bookings: b.bookings?.[0]?.count || 0,
    }));

    res.json(formattedData);
});

app.get('/api/analytics/visitor-locations', async (req, res) => {
    const { branch_id } = req.query;

    let query = supabase.from('visitor_logs').select('country');
    if (branch_id) {
        query = query.or(`branch_id.eq.${branch_id},branch_id.is.null`);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    const counts = {};
    (data || []).forEach((log) => {
        const c = log.country || 'Unknown';
        counts[c] = (counts[c] || 0) + 1;
    });

    const formatted = Object.keys(counts).map((country) => ({
        name: country,
        value: counts[country],
    }));

    res.json(formatted);
});

// 4. CMS - Rooms Management
app.get('/api/rooms', async (req, res) => {
    const { branch_id } = req.query;
    let query = supabase.from('rooms').select('*');
    if (branch_id) query = query.eq('branch_id', branch_id);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.patch('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// 5. Branches
app.get('/api/branches', async (req, res) => {
    const { data, error } = await supabase.from('branches').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.patch('/api/branches/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase.from('branches').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// Serve built frontend in production
const path = require('path');
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.use((req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Alitasha Backend running on port ${PORT}`));
