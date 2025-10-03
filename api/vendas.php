<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_config.php';

// Apenas aceitamos POST para finalizar a venda
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Método não permitido.']));
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->cart, $data->total, $data->shipping)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Dados de checkout incompletos.']));
}

$cart = $data->cart;
$total = $data->total;
$shipping = $data->shipping;

if (empty($cart)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'O carrinho está vazio.']));
}

try {
    // Inicia uma transação para garantir que TUDO (venda, itens, estoque) seja salvo ou NADA seja salvo.
    $pdo->beginTransaction();

    // 1. REGISTRAR A VENDA na tabela 'vendas'
    $sql_venda = "INSERT INTO vendas (valor_total, custo_frete, status) VALUES (?, ?, 'concluida')";
    $stmt_venda = $pdo->prepare($sql_venda);
    $stmt_venda->execute([$total, $shipping]);
    $venda_id = $pdo->lastInsertId(); // Pega a ID da venda recém-criada

    // 2. PROCESSAR ITENS, SALVAR DETALHES e ATUALIZAR ESTOQUE
    $sql_item = "INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)";
    $sql_estoque = "UPDATE produtos SET estoque = estoque - ? WHERE id = ?";

    foreach ($cart as $item) {
        // Encontrar o preço unitário do produto no BD para garantir que o preço não foi adulterado no Front-end
        $stmt_preco = $pdo->prepare("SELECT preco, estoque FROM produtos WHERE id = ?");
        $stmt_preco->execute([$item->id]);
        $produto_db = $stmt_preco->fetch();
        
        if (!$produto_db || $produto_db->estoque < $item->quantity) {
            $pdo->rollBack(); // Desfaz a transação se o estoque for insuficiente
            http_response_code(409); // Conflito
            die(json_encode(['success' => false, 'message' => "Estoque insuficiente para o produto ID: {$item->id}"]));
        }

        // 2a. Salva o item na tabela 'itens_venda'
        $stmt_item = $pdo->prepare($sql_item);
        $stmt_item->execute([
            $venda_id,
            $item->id,
            $item->quantity,
            $produto_db->preco // Usa o preço do banco de dados
        ]);

        // 2b. Atualiza o estoque na tabela 'produtos'
        $stmt_estoque = $pdo->prepare($sql_estoque);
        $stmt_estoque->execute([$item->quantity, $item->id]);
    }

    // Se tudo deu certo, confirma a transação
    $pdo->commit(); 

    echo json_encode([
        'success' => true, 
        'message' => 'Venda finalizada com sucesso!', 
        'venda_id' => $venda_id
    ]);

} catch (Exception $e) {
    // Se algo deu errado em qualquer etapa, desfaz tudo
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erro interno ao processar a venda: ' . $e->getMessage()
    ]);
}