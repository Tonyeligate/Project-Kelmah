const transformImportMetaEnvForJest = ({ types: t }) => {
  const isImportMeta = (node) =>
    t.isMetaProperty(node) &&
    t.isIdentifier(node.meta, { name: 'import' }) &&
    t.isIdentifier(node.property, { name: 'meta' });

  const isImportMetaEnv = (node) =>
    t.isMemberExpression(node) &&
    isImportMeta(node.object) &&
    t.isIdentifier(node.property, { name: 'env' });

  return {
    name: 'transform-import-meta-env-for-jest',
    visitor: {
      MetaProperty(path) {
        if (!isImportMeta(path.node)) {
          return;
        }

        path.replaceWith(
          t.objectExpression([
            t.objectProperty(
              t.identifier('env'),
              t.objectExpression([
                t.objectProperty(t.identifier('DEV'), t.booleanLiteral(false)),
                t.objectProperty(t.identifier('MODE'), t.stringLiteral('test')),
              ]),
            ),
          ]),
        );
      },
      MemberExpression(path) {
        if (isImportMetaEnv(path.node)) {
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(t.identifier('DEV'), t.booleanLiteral(false)),
              t.objectProperty(t.identifier('MODE'), t.stringLiteral('test')),
            ]),
          );
          return;
        }

        if (
          t.isMemberExpression(path.node.object) &&
          isImportMetaEnv(path.node.object) &&
          t.isIdentifier(path.node.property, { name: 'DEV' })
        ) {
          path.replaceWith(t.booleanLiteral(false));
          return;
        }

        if (
          t.isMemberExpression(path.node.object) &&
          isImportMetaEnv(path.node.object) &&
          t.isIdentifier(path.node.property, { name: 'MODE' })
        ) {
          path.replaceWith(t.stringLiteral('test'));
        }
      },
    },
  };
};

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [transformImportMetaEnvForJest],
};