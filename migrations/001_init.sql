create table if not exists metrics_monthly (
  id bigserial primary key,
  state text not null,
  district text not null,
  period date not null,
  households_demanded bigint,
  households_allocated bigint,
  persondays bigint,
  avg_days_per_hh numeric,
  unique (district, period)
);

create table if not exists etl_log (
  id bigserial primary key,
  run_at timestamptz default now(),
  status text not null,
  message text
);

create index if not exists idx_metrics_district_period on metrics_monthly(district, period desc);
