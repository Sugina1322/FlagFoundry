<?php
$users = [
  ["id" => "1", "name" => "admin", "password" => "FLAG{web_stack_triple_threat}"],
  ["id" => "2", "name" => "guest", "password" => "guest"],
];

$page = $_GET["page"] ?? "home";
$name = $_GET["name"] ?? "operator";
$id = $_GET["id"] ?? "1";

function query_user($id, $users) {
  // Intentional SQLi simulation for training: `id=1 OR 1=1` dumps all rows.
  if (preg_match('/or\s+1\s*=\s*1/i', $id)) return $users;
  return array_values(array_filter($users, fn($u) => $u["id"] === $id));
}
?>
<!doctype html>
<html>
<head>
  <title>Vulnerable Web Playground</title>
  <style>
    body { background:#050607; color:#d8ffe0; font-family:monospace; padding:2rem; }
    a,input { color:#00ff41; background:#000; border:1px solid #155f2e; padding:.5rem; }
    pre { border:1px solid #155f2e; padding:1rem; }
  </style>
</head>
<body>
  <h1>Vulnerable Web Playground</h1>
  <p>Hello <?php echo $name; ?></p>
  <nav>
    <a href="/?page=home">home</a>
    <a href="/?page=../../flag.txt">file viewer</a>
    <a href="/?id=1%20OR%201=1">sqli demo</a>
    <a href="/?name=%3Cscript%3Ealert(1)%3C/script%3E">xss demo</a>
  </nav>
  <h2>File viewer</h2>
  <pre><?php
    $file = "/var/www/html/" . $page . ".txt";
    if ($page !== "home" && file_exists($file)) echo htmlspecialchars(file_get_contents($file));
    if (str_contains($page, "../") && file_exists("/var/www/flag.txt")) echo file_get_contents("/var/www/flag.txt");
  ?></pre>
  <h2>User lookup</h2>
  <form><input name="id" value="<?php echo htmlspecialchars($id); ?>"><button>lookup</button></form>
  <pre><?php print_r(query_user($id, $users)); ?></pre>
</body>
</html>

