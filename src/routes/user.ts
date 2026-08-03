import { Hono } from "hono";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

import type { AppEnv } from "../types.js";
import bcrypt from "bcryptjs";

const userRoutes = new Hono<AppEnv>();
userRoutes.get("/", (c) => {
  const payload = c.get("jwtPayload");
  console.log(payload);
  if (payload.name !== "admin") {
    return c.json(
      {
        error: "没有权限",
      },
      403,
    );
  }
  const allUsers = db.select().from(users).all();

  return c.json(allUsers);
});
userRoutes.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  const payload = c.get('jwtPayload')

  if(id !==payload.id){
    return c.json({
      error:'没有权限操作'
    },403)
  }
  const deleted = db.delete(users).where(eq(users.id, id)).returning().get();
  if (!deleted) {
    return c.json({ error: "用户不存在" }, 404);
  }

  return c.json({ message: "删除成功" });
});
userRoutes.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const payload = c.get("jwtPayload");

  if (id !== payload.id) {
    return c.json({ error: "没有权限操作" }, 403);
  }
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
  const hashed  =body.password? bcrypt.hashSync(body.password,10):undefined
  const updated = db
    .update(users)
    .set({
      name: body.name ?? exist.name, // 只更新传了的字段
      password: hashed ?? exist.password,
    })
    .where(eq(users.id, id))
    .returning()
    .get();
  const { password, ...safeUser } = updated;
  return c.json(safeUser);
});
export { userRoutes };
