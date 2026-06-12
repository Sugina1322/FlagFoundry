FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssh-server cron procps \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/run/sshd /opt/maintenance /root \
  && useradd -m -s /bin/bash intern \
  && echo "intern:intern" | chpasswd \
  && echo "FLAG{cron_paths_need_owners}" > /root/root.txt \
  && chmod 600 /root/root.txt \
  && printf '#!/bin/sh\n# root runs this every minute\n/bin/date > /tmp/maintenance.log\n' > /opt/maintenance/run.sh \
  && chmod 777 /opt/maintenance/run.sh \
  && printf '* * * * * root /opt/maintenance/run.sh\n' > /etc/cron.d/flagfoundry-maintenance

EXPOSE 22
CMD service cron start && /usr/sbin/sshd -D -e

