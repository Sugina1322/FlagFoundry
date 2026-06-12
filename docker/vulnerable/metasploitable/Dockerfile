FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssh-server vsftpd samba netcat-traditional \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/run/sshd /srv/ftp /opt/legacy \
  && useradd -m -s /bin/bash legacy \
  && echo "legacy:legacy" | chpasswd \
  && echo "FLAG{legacy_services_are_loud}" > /srv/ftp/flag.txt \
  && chmod 644 /srv/ftp/flag.txt \
  && printf 'listen=YES\nanonymous_enable=YES\nlocal_enable=YES\nwrite_enable=NO\nanon_root=/srv/ftp\nseccomp_sandbox=NO\n' > /etc/vsftpd.conf \
  && printf '[global]\nmap to guest = Bad User\nserver role = standalone server\n[public]\npath = /srv/ftp\nread only = yes\nguest ok = yes\n' > /etc/samba/smb.conf

EXPOSE 21 22 139 445
CMD service smbd start && service nmbd start && service vsftpd start && /usr/sbin/sshd -D -e

