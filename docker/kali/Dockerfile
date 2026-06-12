FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash curl dnsutils ftp gobuster hydra iproute2 iputils-ping john nmap netcat-traditional \
    nikto openssh-client python3 python3-pip sqlmap vim wget wordlists \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /root
CMD ["/bin/bash"]

