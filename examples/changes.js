import { Stream } from "../src";

Stream.array( [true, true, true, true, true, false, false, false]).changes().log('seq')