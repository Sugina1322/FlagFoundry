FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssh-server sudo vim less procps \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/run/sshd \
  && useradd -m -s /bin/bash trainee \
  && echo "trainee:password123" | chpasswd \
  && echo "trainee ALL=(root) NOPASSWD: /usr/bin/vim" > /etc/sudoers.d/trainee-vim \
  && chmod 440 /etc/sudoers.d/trainee-vim \
  && mkdir -p /home/trainee/notes /root \
  && echo "Try harder: sudo -l is your friend." > /home/trainee/notes/readme.txt \
  && echo "FLAG{linux_basic_sudo_path}" > /root/root.txt \
  && chmod 600 /root/root.txt

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D", "-e"]

