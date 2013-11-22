#!/bin/bash

# Packages up this app in a tar.gz, respecting the settings in .gitignore and .npmignore.
tar --exclude-from=.gitignore --exclude-from=.npmignore -czf lantern.tar.gz .