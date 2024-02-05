const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
	host: 'smtp.mail.ru',
	port: 465,
	secure: true,
	auth: {
		user: 'paungire@bk.ru',
		pass: 'uZUqh7nYmbHkH3zN2B7i',
	},
})

module.exports = transporter
