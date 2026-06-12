FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssh-server sudo findutils procps \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/run/sshd /opt/audit /srv/share \
  && useradd -m -s /bin/bash learner \
  && echo "learner:learner" | chpasswd \
  && echo "FLAG{permissions_tell_stories}" > /srv/share/project-flag.txt \
  && chmod 644 /srv/share/project-flag.txt \
  && echo "Start with find, ls -l, and cat." > /home/learner/readme.txt \
  && chown -R learner:learner /home/learner

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D", "-e"]

