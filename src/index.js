#!/usr/bin/env node

import Parser from 'tap-parser';
import { _ } from './utils.js';
import { Event, passEvent } from './events.js';
import logEvent from './logEvent.js';
import { init, update, mutate } from './states/state.js';
import render from './render.js';
import print from './io/print.js';
import resize from './io/resize.js';
import Clock from './io/clock.js';
import * as options from './options.js';

const store = init();

const main = state =>
    state
    |> update
    |> render(options)
    |> mutate(store)
    |> print(event)
    |> release(clock)
;

const parser = new Parser();
const event = _(passEvent(store, main));
const register = e => logEvent(event('log'), Event(e));

parser.on('result', event('result'));
parser.on('comment', register('comment'));
parser.on('complete', register('complete'));
parser.on('result', register('result'));
parser.on('complete', event('complete'));
resize(options.resize, event('resize'))
const clock = Clock(event('clock'), 120);

const release = clock => ({ end }) =>
    end && clock.stop()
;

process.stdin.pipe(parser);

console.clear();
