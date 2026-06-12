<?php
$message = "Login as admin.";
$flag = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $username = $_POST["username"] ?? "";
  $password = $_POST["password"] ?? "";

  // Intentional training vulnerability: SQL-like auth bypass simulation.
  if (($username === "admin" && $password === "not-the-password") || preg_match("/or\\s+'?1'?\\s*=\\s*'?1'?/i", $username)) {
    $message = "Welcome admin.";
    $flag = "FLAG{auth_bypass_is_not_auth}";
  } else {
    $message = "Invalid login.";
  }
}
?>
<!doctype html>
<html>
<head>
  <title>Login Bypass Basics</title>
  <style>
    body { background:#050607; color:#d8ffe0; font-family:monospace; padding:2rem; }
    input,button { color:#00ff41; background:#000; border:1px solid #155f2e; padding:.6rem; margin:.25rem; }
    .panel { border:1px solid #155f2e; padding:1rem; max-width:36rem; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>Login Bypass Basics</h1>
    <p><?php echo htmlspecialchars($message); ?></p>
    <form method="post">
      <input name="username" placeholder="username">
      <input name="password" placeholder="password" type="password">
      <button>login</button>
    </form>
    <?php if ($flag): ?><pre><?php echo $flag; ?></pre><?php endif; ?>
  </div>
</body>
</html>

