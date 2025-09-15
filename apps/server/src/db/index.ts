import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as studySchema from "./schema/study";

export const db = drizzle(process.env.DATABASE_URL || "", {
	schema: {
		...authSchema,
		...studySchema,
	},
});
