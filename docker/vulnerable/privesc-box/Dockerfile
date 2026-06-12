FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssh-server cron gcc sudo procps \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/run/sshd /opt/backup /root \
  && useradd -m -s /bin/bash analyst \
  && echo "analyst:analyst" | chpasswd \
  && echo "FLAG{cron_and_suid_checked}" > /root/root.txt \
  && chmod 600 /root/root.txt \
  && printf '#!/bin/sh\n/bin/cp /root/root.txt /tmp/root.txt\n/bin/chmod 644 /tmp/root.txt\n' > /opt/backup/backup.sh \
  && chmod 777 /opt/backup/backup.sh \
  && printf '* * * * * root /opt/backup/backup.sh\n' > /etc/cron.d/backup \
  && printf '#include <unistd.h>\nint main(){setuid(0);setgid(0);execl("/bin/bash","bash","-p",NULL);return 0;}\n' > /tmp/suid-shell.c \
  && gcc /tmp/suid-shell.c -o /usr/local/bin/healthcheck \
  && chmod 4755 /usr/local/bin/healthcheck \
  && rm /tmp/suid-shell.c

EXPOSE 22
CMD service cron start && /usr/sbin/sshd -D -e

