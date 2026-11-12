USE gym_arena_kju;

INSERT INTO membership_plans (name, description, monthly_coin_price, active)
VALUES
  ('Standard Monthly', 'Full gym access for one month.', 100, 1),
  ('Student Plus', 'Full gym access plus priority equipment booking.', 150, 1)
ON DUPLICATE KEY UPDATE
  description=VALUES(description),
  monthly_coin_price=VALUES(monthly_coin_price),
  active=VALUES(active);

INSERT INTO equipment (name, description, status, active)
VALUES
  ('Treadmill 1', 'Cardio treadmill near the entrance.', 'AVAILABLE', 1),
  ('Treadmill 2', 'Cardio treadmill in cardio zone.', 'AVAILABLE', 1),
  ('Bench Press', 'Olympic bench press station.', 'AVAILABLE', 1),
  ('Squat Rack', 'Power rack for squats and compound lifts.', 'AVAILABLE', 1),
  ('Exercise Bike', 'Stationary exercise bike.', 'AVAILABLE', 1),
  ('Cable Machine', 'Multi-purpose cable station.', 'AVAILABLE', 1)
ON DUPLICATE KEY UPDATE description=VALUES(description), status=VALUES(status), active=VALUES(active);

INSERT INTO products (name, description, coin_price, stock_qty, image_url, active)
VALUES
  ('Gym Arena Shaker', 'Reusable 700 ml shaker bottle.', 35, 30, NULL, 1),
  ('KJU Gym Towel', 'Quick-dry training towel.', 45, 25, NULL, 1),
  ('Resistance Band', 'Medium-resistance exercise band.', 60, 20, NULL, 1),
  ('Gym Gloves', 'Basic training gloves.', 80, 15, NULL, 1);
