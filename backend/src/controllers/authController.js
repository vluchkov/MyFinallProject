import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/emailConfig.js";

export const registerUser = async (req, res) => {
  try {
    const { email, phone, username, password } = req.body;

    // Проверяем существование пользователя по email, username или phone
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res
          .status(400)
          .json({ message: "Пользователь с таким email уже существует" });
      }
      if (existingUser.username === username) {
        return res
          .status(400)
          .json({ message: "Пользователь с таким именем уже существует" });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({
          message: "Пользователь с таким номером телефона уже существует",
        });
      }
    }

    const newUser = new User({ username, email, password, phone });
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);
    await newUser.save();

    // Создаем токен для автоматического входа после регистрации
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "23h",
    });

    res.status(201).json({
      message: "Регистрация успешна",
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Обработка ошибки дубликата MongoDB
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        message: `Пользователь с таким ${
          field === "email"
            ? "email"
            : field === "username"
            ? "именем"
            : "номером телефона"
        } уже существует`,
      });
    } else {
      res.status(500).json({ message: "Ошибка при регистрации пользователя" });
    }
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email);

    const user = await User.findOne({ email }).select("+password");
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(404).json({
        message: "Пользователь с таким email не найден",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Неверный пароль",
      });
    }

    // Создаем токен
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "23h",
    });

    // Отправляем токен и данные пользователя (без пароля)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      fullName: user.fullName,
      website: user.website,
    };

    res.status(200).json({
      message: "Вход выполнен успешно",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Произошла ошибка при входе в систему",
    });
  }
};

// Получение данных текущего пользователя
export const getMe = async (req, res) => {
  try {
    // req.user добавляется middleware verifyToken
    const user = await User.findById(req.user.id).select("-password"); // Исключаем пароль

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getMe:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении данных пользователя" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Пользователь с таким email не найден"
      });
    }

    // Генерируем токен для сброса
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Сохраняем токен в базе данных
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 час
    await user.save();

    // Создаем ссылку для сброса пароля
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // HTML шаблон письма
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #262626; margin: 0;">Сброс пароля</h1>
        </div>
        
        <div style="color: #262626; line-height: 1.6;">
          <p>Здравствуйте!</p>
          <p>Вы запросили сброс пароля для вашего аккаунта в Instagram Clone.</p>
          <p>Для сброса пароля, пожалуйста, нажмите на кнопку ниже:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0095f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Сбросить пароль
            </a>
          </div>
          
          <p>Или скопируйте и вставьте следующую ссылку в ваш браузер:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <p style="color: #8e8e8e; font-size: 14px;">
            Ссылка действительна в течение 1 часа.
          </p>
          
          <p style="color: #8e8e8e; font-size: 14px;">
            Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #8e8e8e; font-size: 12px;">
          <p>С уважением,<br>Команда поддержки Instagram Clone</p>
        </div>
      </div>
    `;

    // Отправляем email
    await sendEmail(
      email,
      'Сброс пароля - Instagram Clone',
      html
    );

    res.status(200).json({
      message: "Инструкции по сбросу пароля отправлены на ваш email"
    });
  } catch (error) {
    console.error("Ошибка при запросе сброса пароля:", error);
    res.status(500).json({
      message: "Произошла ошибка при обработке запроса"
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Недействительный или истекший токен сброса пароля"
      });
    }

    // Хешируем новый пароль
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Пароль успешно изменен"
    });
  } catch (error) {
    console.error("Ошибка при сбросе пароля:", error);
    res.status(500).json({
      message: "Произошла ошибка при сбросе пароля"
    });
  }
};
