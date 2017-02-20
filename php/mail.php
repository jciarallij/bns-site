<?php

      ini_set('display_errors', 1);
      ini_set('display_startup_errors', 1);
      error_reporting(E_ALL);

      require_once('/usr/share/php/libphp-phpmailer/class.phpmailer.php');
      $mail = new PHPMailer(); // defaults to using php "mail()"
      $body = $_POST['message'];
      $mail->AddReplyTo($_POST['email'],$_POST['name']);
      $mail->SetFrom('hello@businessnavigation.net');
      $mail->AddAddress("kimberly.dunham@businessnavigation.net", "Kimberly Dunham");
      $mail->Subject    = "Message from businessnavigation.com";
      $mail->MsgHTML("Message From: " . $_POST['name'] . "  | Email: " . $_POST['email'] . " | Phone: " . $_POST['phone'] . " | "  . $body);

      if(!$mail->Send()) {
      echo "Mailer Error: " . $mail->ErrorInfo;
      } else {
      echo "Message sent!";
      }
      header('location: /#banner');

?>
