# Summarize

This just prints out a quick summary of the commits you wrote to `master`
on github in the last day. It is very hacky.

Use:

```
yarn install
node summarize --username ${your username}
```

By default it filters commits that happened since yesterday, but if you
were out yesterday (or yesterday was sunday) you can also pass a `--since`
flag with a `MM-DD-YYYY` date to use instead.

Yay!
