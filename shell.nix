with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "fotos";

  buildInputs = [
    stdenv

    nodejs-10_x
    yarn
  ];
}
