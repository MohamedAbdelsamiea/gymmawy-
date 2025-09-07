{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.postgresql_15
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
  ];
}
