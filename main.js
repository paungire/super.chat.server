import express, { json } from 'express'
const app = express()
const port = 80

//* политика CORS
import cors from 'cors'
app.use(cors())

//* отправка почты
import transporter from './mail.cjs'
import { readFileSync } from 'fs'
//* создаем парсер для данных в формате json
const jsonParser = json()
//* подключение к бдшке
import { connection } from './bd.js'
connection.addListener('error', (err) => {
	console.log(err)
})

app.post('/register/', jsonParser, (req, res) => {
	const email = req.body.email
	const password = req.body.password
	let sql

	//todo ПРОВЕРКА НА НАЛИЧИЕ В СИСТЕМЕ
	sql = 'SELECT * FROM `chat`.users WHERE email = "' + email + '"'
	connection.query(sql, (err, rows, fields) => {
		if (err instanceof Error) {
			console.log(err)
			return
		}
		if (!!rows[0]) {
			res.send({
				error: 'email',
				error_log: 'вы уже зарегистрированы на эту почту',
			})
		} else {
			//todo ОТПРАВКА ПИСЬМА С КОДОМ ПОДТВЕРЖДЕНИЯ
			let html = readFileSync('./mail_examples/confirm_code.html', 'utf8')
			const random_code = Math.trunc(Math.random() * (999999 - 100000) + 100000)
			html = html.replace('{{CODE}}', random_code)
			const result = transporter.transporter(
				{
					from: '"CHAT" <paungire@bk.ru>',
					to: email,
					subject: 'Please, confirm registration',
					text: 'This message was sent from Node js server.',
					html: html,
				},
				(err, info) => {
					console.log(info)
					if (!!info) {
						sql =
							"INSERT INTO `chat`.`users` (`email`, `password`) VALUES ('" +
							email +
							"', '" +
							password +
							"')"
						connection.query(sql, (err, rows, fields) => {
							if (err instanceof Error) {
								console.log(err)
								return
							}
							res.send({
								success: true,
								log: [
									'пользователь успешно зарегистрирован',
									'сообщение с кодом подтверждения отправлено',
								],
							})
						})
					} else {
						res.send({
							error: 'email',
							error_log: 'такой почты не существует',
						})
					}
				}
			)
		}
	})
})

import { createClient } from 'redis'
const client = await createClient()
	.on('error', (err) => console.log('Redis Client Error', err))
	.connect()

await client.set('key', 'value')
const value = await client.get('key')
console.log(value)
await client.disconnect()

app.post('/confirm/', jsonParser, (req, res) => {
	req.body.code
})

app.get('/', (req, res) => {
	res.send('HELLO SUKI')
})

app.listen(port, () => {
	console.log(`${port}`)
})
