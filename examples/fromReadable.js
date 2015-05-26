import { Stream } from "../src"
import fs from "fs"

Stream.fromReadable( fs.createReadStream('examples/hello.js', {encoding: 'utf8'}) ).log('file')