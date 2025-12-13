/**
 * Jest config para funcionar com Docker no Windows
 * O polling é necessário porque o Docker não propaga eventos inotify corretamente
 */
module.exports = {
  // Força o Jest a usar polling para detectar alterações
  watchPlugins: [],
  // Ignora node_modules para performance
  watchPathIgnorePatterns: ["node_modules"],
  // Configuração de timeout para ambientes mais lentos
  testTimeout: 10000,
};
