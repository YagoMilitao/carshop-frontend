# Regra: React

- React é a biblioteca de UI em todas as camadas (Server e Client
  Components, quando o App Router estiver em uso).
- Componentes seguem composição e separação container/apresentação apenas
  quando fizer sentido para a task — não introduzir abstração antecipada.
- Hooks seguem as regras padrão do React (não condicionais, não em loops);
  lint (`eslint-plugin-react-hooks`) deve passar sem supressões.
- Preferir componentes pequenos e coesos a componentes que acumulam múltiplas
  responsabilidades; extrair apenas quando há reuso real ou a task exige.
- Nomenclatura e organização de arquivos seguem o padrão já usado em `src/`
  — não criar uma convenção paralela sem necessidade.
