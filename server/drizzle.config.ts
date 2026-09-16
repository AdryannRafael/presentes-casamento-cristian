import { defineConfig } from 'drizzle-kit';
import { CreateUri } from '@/src/infra/db';
import {join} from "path"

const path = join(".","src","infrastructure", "db","schema", "*.ts" )
export default defineConfig({
    // schema: "./src/db/schema/*.ts",
    // schema: path,
    schema: "./src/infrastructure/db/schema/*.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: CreateUri()
    },
    
})