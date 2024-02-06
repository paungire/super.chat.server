import express, { json } from 'express'
const app = express()
const port = 80

import * as fs from 'fs'

//* политика CORS
import cors from 'cors'
app.use(cors())

//* отправка почты
import { createTransport } from 'nodemailer'
const transporter = createTransport({
	host: 'smtp.mail.ru',
	port: 465,
	secure: true,
	auth: {
		user: 'paungire@bk.ru',
		pass: 'uZUqh7nYmbHkH3zN2B7i',
	},
})
//* создаем парсер для данных в формате json
app.use(json())
//* подключение к бдшке
import { createConnection } from 'mysql2'
const connection = createConnection({
	host: '127.0.0.1',
	user: 'root',
	database: 'chat',
	port: 3306,
	password: '10101011',
})

app.post('/register/', (req, res) => {
	const email = req.body.email
	const password = req.body.password
	if (!email || !password) {
		res.send({
			error: [],
			error_log: 'не заполнены обязательные поля',
		})
		return 0
	}
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
				error: ['email'],
				error_log: 'вы уже зарегистрированы на эту почту',
			})
			return 0
		} else {
			// //todo ОТПРАВКА ПИСЬМА С КОДОМ ПОДТВЕРЖДЕНИЯ
			let html = fs.readFileSync('./mail_examples/confirm_code.html', 'utf8')
			const random_code = Math.trunc(Math.random() * (999999 - 100000) + 100000)
			html = html.replace('{{CODE}}', random_code)
			const result = transporter.sendMail(
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
							return 0
						})
					} else {
						res.send({
							error: 'email',
							error_log: 'такой почты не существует',
						})
						return 0
					}
				}
			)
		}
	})
})

// const createClient = require('redis')
// const client = createClient()
// 	.on('error', (err) => console.log('Redis Client Error', err))
// 	.connect()

// client.set('key', 'value')
// const value = client.get('key')
// console.log(value)
// client.disconnect()

app.post('/confirm/', (req, res) => {
	req.body.code
})

app.get('/', (req, res) => {
	res.send('HELLO SUKI')
})

app.listen(port, () => {
	console.log(`${port}`)
})
