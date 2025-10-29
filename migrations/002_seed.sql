-- Seed one latest-month KPI row for display without ETL
insert into metrics_monthly(state, district, period, households_demanded, households_allocated, persondays, avg_days_per_hh)
values ('Uttar Pradesh', 'Lucknow', date_trunc('month', now())::date, 120000, 98000, 1250000, 18.5)
ON CONFLICT (district, period) DO NOTHING;
