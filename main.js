import express, { json } from 'express'
import parseurl from 'parseurl'
const app = express()
const port = 3111

import * as fs from 'fs'

//* политика CORS
import cors from 'cors'
app.use(cors())
app.all('/*', function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'X-Requested-With')
	next()
})

//* REDIS SESSIONS
import RedisStore from 'connect-redis'
import session from 'express-session'
import { createClient } from 'redis'
// Initialize client.
let redisClient = createClient()
redisClient.connect().catch(console.error)
// Initialize store.
let redisStore = new RedisStore({
	client: redisClient,
	prefix: 'myapp:',
})
// Initialize session storage.
app.use(
	session({
		store: redisStore,
		resave: false, // required: force lightweight session keep alive (touch)
		saveUninitialized: false, // recommended: only save session when data exists
		secret: 'keyboard cat',
	})
)

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

app.post('/api/register/', (req, res) => {
	const email = req.body.email
	const password = req.body.password
	if (!email || !password) {
		res.send({
			error: ['email', 'password'],
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
							req.session.user = {
								email: email,
								code: random_code,
							}
							req.session.save()
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

app.post('/api/confirm/', (req, res) => {
	if (req.body.code == req.session.user.code) {
		let sql =
			'UPDATE users SET active = 1 WHERE email = "zzz.lify@icloud.com" LIMIT 1'
		connection.query(sql, (err, rows) => {
			if (rows.info) {
				delete req.session.user.code
				req.session.user.auth = true
				req.session.save()
				res.send({
					success: true,
					log: ['ваша почта успешно подтверждена'],
				})
			}
		})
	} else {
		res.send({
			error: ['code'],
			error_log: ['неверный код'],
		})
	}
})

app.post('/api/login/', (req, res) => {
	if (!req.body.email || !req.body.password) {
		res.send({
			error: ['email', 'password'],
			error_log: 'не заполнены обязательные поля',
		})
		return 0
	}
	let sql = "SELECT * FROM users WHERE email = '" + req.body.email + "'"
	connection.query(sql, (err, rows) => {
		if (!!rows[0]) {
			if (!rows[0].active) {
				res.send({
					error: ['active'],
					error_log: ['подтвердите почту'],
				})
			} else if (req.body.password == rows[0].password) {
				req.session.user.auth = true
				req.session.save()
				res.send({
					success: true,
					log: ['успешный вход'],
				})
			} else {
				res.send({
					error: ['password'],
					error_log: ['неверный пароль'],
				})
			}
		} else {
			res.send({
				error: ['email'],
				error_log: ['нет пользователя с такой почтой'],
			})
		}
	})
})

app.post('/api/session/', (req, res) => {
	if (res.session.user.active) {
		res.send({
			success: true,
		})
	} else {
		res.send({
			success: false,
		})
	}
})

app.listen(port, () => {
	console.log(`${port}`)
})
