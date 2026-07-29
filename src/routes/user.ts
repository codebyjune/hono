import { Hono } from "hono";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const createUserSchema = z.object({
  name: z.string().min(2).max(20),
  password: z.string().min(6),
});
const userRoutes = new Hono();
userRoutes.get("/", (c) => {
  const allUsers = db.select().from(users).all();
  return c.json(allUsers);
});
userRoutes.post("/", zValidator("json", createUserSchema), async (c) => {
  const body = c.req.valid("json");
  const exist = db.select().from(users).where(eq(users.name, body.name)).get();
  if (exist) {
    return c.json(
      {
        error: "用户名已存在",
      },
      400,
    );
  }
  const res = db.insert(users).values(body).returning().get();
  const { password, ...safeUser } = res;
  return c.json(safeUser, 201);
});
userRoutes.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  const deleted = db.delete(users).where(eq(users.id, id)).returning().get();
  if (!deleted) {
    return c.json({ error: "用户不存在" }, 404);
  }

  return c.json({ message: "删除成功" });
});
userRoutes.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  let exist = db.select().from(users).where(eq(users.id, id)).get();
  if (!exist) {
    return c.json(
      {
        error: "用户不存在",
      },
      404,
    );
  }
  const body = await c.req.json();
  const updated = db
    .update(users)
    .set({
      name: body.name ?? exist.name, // 只更新传了的字段
      password: body.password ?? exist.password,
    })
    .where(eq(users.id, id))
    .returning()
    .get();
  const { password, ...safeUser } = updated;
  return c.json(safeUser);
});
export { userRoutes };
