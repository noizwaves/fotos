let
  pkgs = import (builtins.fetchTarball {
    name = "nixos-stable-2021-11";
    url = "https://github.com/nixos/nixpkgs/archive/00f84d37a2507dee0219cf894f11a7cbf0c49ccb.tar.gz";
    sha256 = "1vn0y9rppsw5bvn0mrhfd1vgx7kqcdaw6j9x1623qbj27rz3aj7i";
  }) {};
in pkgs.mkShell {
  name = "fotos";

  nativeBuildInputs = with pkgs; [
    stdenv
    nodejs-16_x
    yarn
  ];
}
