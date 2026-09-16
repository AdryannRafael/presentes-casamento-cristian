
interface Enviroment {
  DB_HOST: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

export const env: Enviroment = {
    DB_HOST: getEnvOrThrow('DB_HOST'),
    DB_USERNAME: getEnvOrThrow('DB_USERNAME'),
    DB_PASSWORD: getEnvOrThrow('DB_PASSWORD'),
    DB_NAME: getEnvOrThrow('DB_NAME'),
}

function getEnvOrThrow<T = string>(key: keyof Enviroment, throwable: boolean = true): T {
    const value = Bun.env[key];
    if(throwable && (value == undefined || value === null || value === "")){
        throw new Error(`Environment variable ${key} is not defined`);
    }
    return value as unknown as T;
}