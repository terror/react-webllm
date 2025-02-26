set dotenv-load

export EDITOR := 'vim'

alias f := fmt

default:
  just --list

fmt:
  prettier --write .
