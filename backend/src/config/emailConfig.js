import nodemailer from 'nodemailer';

// Проверяем наличие необходимых переменных окружения
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('Ошибка: EMAIL_USER и EMAIL_PASSWORD должны быть установлены в .env файле');
  process.exit(1);
}

console.log('Настройка email с параметрами:', {
  user: process.env.EMAIL_USER,
  // Не логируем пароль из соображений безопасности
  hasPassword: !!process.env.EMAIL_PASSWORD
});

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Включаем режим отладки
  logger: true // Включаем логирование
});

// Проверяем подключение при запуске
transporter.verify(function(error, success) {
  if (error) {
    console.error('Ошибка настройки email:', error);
    console.error('Проверьте правильность EMAIL_USER и EMAIL_PASSWORD в .env файле');
    console.error('Убедитесь, что:');
    console.error('1. Включена двухфакторная аутентификация в Google аккаунте');
    console.error('2. Пароль приложения создан правильно');
    console.error('3. В .env файле нет лишних пробелов или кавычек');
  } else {
    console.log('Сервер готов к отправке email');
    console.log('Используется email:', process.env.EMAIL_USER);
  }
});

// Функция для отправки email
export const sendEmail = async (to, subject, html) => {
  try {
    console.log('Попытка отправки email на адрес:', to);
    
    const mailOptions = {
      from: `"Instagram Clone" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    console.log('Параметры письма:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email успешно отправлен:', info.messageId);
    console.log('Ответ сервера:', info.response);
    return true;
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    console.error('Детали ошибки:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw new Error('Не удалось отправить email. Пожалуйста, попробуйте позже.');
  }
}; 