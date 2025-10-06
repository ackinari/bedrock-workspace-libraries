# Maths Library

Biblioteca matemática com funções utilitárias para projetos Minecraft Bedrock.

## Funções Disponíveis

### `clamp(value, min, max)`
Limita um valor entre um mínimo e máximo.

**Parâmetros:**
- `value` (number): Valor a ser limitado
- `min` (number): Valor mínimo
- `max` (number): Valor máximo

**Retorna:** (number) Valor limitado

### `lerp(a, b, t)`
Interpolação linear entre dois valores.

**Parâmetros:**
- `a` (number): Valor inicial
- `b` (number): Valor final
- `t` (number): Fator de interpolação (0-1)

**Retorna:** (number) Valor interpolado

### `map(value, inMin, inMax, outMin, outMax)`
Mapeia um valor de uma faixa para outra.

**Parâmetros:**
- `value` (number): Valor a ser mapeado
- `inMin` (number): Mínimo da faixa de entrada
- `inMax` (number): Máximo da faixa de entrada
- `outMin` (number): Mínimo da faixa de saída
- `outMax` (number): Máximo da faixa de saída

**Retorna:** (number) Valor mapeado

## Como Usar

### Opção 1: Import Simples (Recomendado)
```javascript
import { clamp, lerp, map } from 'libraries/maths/clamp';

// Usar as funções
const health = clamp(playerHealth, 0, 100);
const smoothValue = lerp(currentValue, targetValue, 0.1);
const mappedValue = map(input, 0, 255, 0, 1);
```

### Opção 2: Import com @workspace
```javascript
import { clamp, lerp, map } from '@workspace/maths';

const health = clamp(playerHealth, 0, 100);
```

### Opção 3: Import Relativo
```javascript
import { clamp, lerp, map } from './libraries/maths/clamp';

const health = clamp(playerHealth, 0, 100);
```

## Detecção Automática

O sistema detecta automaticamente quando você usa esta biblioteca e a copia para o development folder do Minecraft. Quando você remove os imports, a biblioteca é automaticamente removida do development.

## Exemplo Completo

```typescript
import { world } from "@minecraft/server";
import { clamp, lerp } from 'libraries/maths/clamp';

world.beforeEvents.chatSend.subscribe((event) => {
  const { sender, message } = event;
  
  if (message.startsWith("health")) {
    const args = message.split(" ");
    const inputHealth = parseInt(args[1]) || 0;
    
    // Usar clamp para garantir que a vida está entre 0 e 100
    const clampedHealth = clamp(inputHealth, 0, 100);
    
    event.cancel = true;
    world.sendMessage(`Health set to: ${clampedHealth}`);
  }
});
