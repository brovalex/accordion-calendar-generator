{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = [
    pkgs.nodejs_22
  ];

  shellHook = ''
    echo "node $(node --version) / npm $(npm --version)"
    [ -d node_modules ] || echo "node_modules missing: run 'npm install'"
  '';
}
