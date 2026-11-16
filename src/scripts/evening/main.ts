import { dockBar } from '../dock';
import { revealFoot } from '../foot';
import { floatGet } from '../get';
import { start } from './live';
floatGet(document);
start(document, window);
dockBar(document);
revealFoot(document);
