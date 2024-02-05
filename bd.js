import { createConnection } from 'mysql2'
export const connection = createConnection({
	host: '127.0.0.1',
	user: 'root',
	database: 'chat',
	port: 3306,
	password: '10101011',
})
