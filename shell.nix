with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "fotos";

  buildInputs = [
    stdenv

    nodejs-16_x
    yarn
  ];
}
