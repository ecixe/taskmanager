package com.company.taskmanager.configuration;

import jakarta.mail.Session;
import jakarta.mail.Transport;
import java.util.Properties;

public class MailtrapTest {
    public static void main(String[] args) {
        String host = "sandbox.smtp.mailtrap.io";
        String username = "fe5989ede07fa2";
        String password = "7160868537e230";

        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", "2525");

        try {
            Session session = Session.getInstance(props);
            Transport transport = session.getTransport("smtp");
            transport.connect(host, username, password);
            System.out.println("✅ SMTP bağlantısı uğurla quruldu!");
            transport.close();
        } catch (Exception e) {
            System.out.println("❌ SMTP bağlantısı alınmadı: " + e.getMessage());
        }
    }
}
