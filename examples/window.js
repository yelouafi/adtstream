import { Stream } from "../src";

Stream.range(1, 5, 0, 1000).window(3,3).log('seq')