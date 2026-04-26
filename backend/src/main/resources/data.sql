-- 插入管理员账户（密码: jzh145145 的 BCrypt 加密）
INSERT INTO users (username, password, email, role, status, avatar_url, bio, created_at, updated_at)
SELECT 'admin', '$2b$10$zDdmgmaFcIVOG563pvGsB.BsOeYWU27x.zipbAJ5aI0EGQGa5jUGW', 'admin@deepzho.top', 'ADMIN', 'ACTIVE', null, 'Site Administrator', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
