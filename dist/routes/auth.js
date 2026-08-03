import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
const JWT_SECRET = process.env.JWT_SECRET ?? "xixi";
const EXPIRES_IN = 60 * 60;
const authRoutes = new Hono();
const authschema = z.object({
    name: z.string().min(2).max(20),
    password: z.string().min(6),
});
authRoutes.post("/register", zValidator("json", authschema), async (c) => {
    const { password, name } = c.req.valid("json");
    const exist = db.select().from(users).where(eq(users.name, name)).get();
    if (exist)
        return c.json({
            error: "用户名已经存在",
        }, 400);
    const hashed = bcrypt.hashSync(password, 10);
    const user = db
        .insert(users)
        .values({
        name,
        password: hashed,
    })
        .returning()
        .get();
    const token = await sign({
        id: user.id,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + EXPIRES_IN,
    }, JWT_SECRET);
    const { password: _, ...safeUser } = user;
    return c.json({
        user: safeUser,
        token,
    }, 201);
});
authRoutes.post("/login", zValidator("json", authschema), async (c) => {
    const { password, name } = c.req.valid("json");
    const user = db.select().from(users).where(eq(users.name, name)).get();
    if (!user)
        return c.json({
            error: "用户名或者密码错误",
        }, 400);
    const isTrue = await bcrypt.compare(password, user.password);
    if (!isTrue)
        return c.json({
            error: "用户名或者密码错误",
        }, 400);
    const token = await sign({
        id: user.id,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + EXPIRES_IN,
    }, JWT_SECRET);
    const { password: _, ...safeUser } = user;
    return c.json({ user: safeUser, token });
});
export { authRoutes };
