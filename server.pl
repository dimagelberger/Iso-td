#!/usr/bin/perl
# Minimal static file server for iso-td
use strict; use warnings;
use IO::Socket::INET;

my $port = 5500;
my $root = "H:/Claude/iso-td";   # serve from project root
(my $root_fs = $root) =~ s|/|\\|g;  # Windows path for file ops

my %MIME = (
  html => 'text/html; charset=utf-8',
  htm  => 'text/html; charset=utf-8',
  css  => 'text/css',
  js   => 'application/javascript',
  mjs  => 'application/javascript',
  json => 'application/json',
  png  => 'image/png',
  jpg  => 'image/jpeg',
  ico  => 'image/x-icon',
  svg  => 'image/svg+xml',
);

my $srv = IO::Socket::INET->new(
  LocalPort => $port, Type => SOCK_STREAM,
  ReuseAddr => 1, Listen => 10,
) or die "bind :$port failed – $!\n";

print "Serving $root at http://localhost:$port\n";
$| = 1;

while (my $c = $srv->accept) {
  eval {
    local $SIG{PIPE} = 'IGNORE';  # ignore broken-pipe from abrupt browser disconnect

    my $req = '';
    while (my $ln = <$c>) { $req .= $ln; last if $ln eq "\r\n" }

    my ($method, $uri) = $req =~ /^(\w+)\s+(\S+)/;
    $uri //= '/';
    $uri =~ s/\?.*//;
    $uri =~ s/%([0-9A-Fa-f]{2})/chr hex $1/ge;
    $uri = '/index.html' if $uri eq '/';
    $uri =~ s|[/\\]+|/|g;
    $uri =~ s|\.\./||g;

    my $path = $root . $uri;
    (my $path_w = $path) =~ s|/|\\|g;

    if (-f $path_w) {
      open my $fh, '<:raw', $path_w or die "open failed: $!";
      local $/; my $body = <$fh>; close $fh;
      my ($ext) = $path_w =~ /\.(\w+)$/;
      my $ct = $MIME{lc($ext//'')} // 'application/octet-stream';
      printf $c "HTTP/1.1 200 OK\r\nContent-Type: %s\r\nContent-Length: %d\r\n".
                "Cache-Control: no-cache\r\nAccess-Control-Allow-Origin: *\r\n\r\n",
                $ct, length $body;
      print $c $body;
    } else {
      print $c "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\n\r\nNot found";
    }
  };
  # $@ silently swallowed — keeps the server alive through any per-request error
  close $c;
}
