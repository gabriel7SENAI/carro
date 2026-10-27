# Oficina virtual 3D

Protótipo educativo em Three.js com Audi S3, motor V8 twin-turbo e uma atividade guiada de troca do filtro de ar. Inclui o modelo procedural do Chevrolet Celta 2005.

## Executar

Na raiz do projeto, execute:

```sh
python -m http.server 8000
```

Abra http://localhost:8000/carro-3d-threejs/ no navegador. É necessária conexão com a internet para carregar Three.js e fontes. Sirva a raiz inteira: os modelos GLB ficam um nível acima da página.

## Interações

- Girar, aproximar e mover a câmera.
- Alterar pintura e iluminação.
- Abrir capô e porta-malas do Audi.
- Iniciar a atividade do filtro de ar, usando cliques nas peças ou botões.
- Alternar entre Audi e Celta.

O motor V8 é uma montagem visual fictícia; a atividade usa componentes didáticos e não descreve a manutenção real do Audi.

Os modelos GLB foram fornecidos pelo usuário. Suas licenças e atribuições não foram informadas neste projeto; nenhuma licença de redistribuição desses arquivos é concedida por este README.

Mais detalhes em [carro-3d-threejs/README.md](carro-3d-threejs/README.md).
