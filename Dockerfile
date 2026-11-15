
FROM nginxinc/nginx-unprivileged:1.30-alpine

LABEL org.opencontainers.image.title="Inclui+" \
      org.opencontainers.image.description="Acessibilidade verificada por necessidade - FIAP Global Solution 2026.2"

# Aplica as correções de segurança publicadas pelo Alpine depois da imagem base
# (o Trivy barra CVE crítico com correção disponível).
USER root
RUN apk upgrade --no-cache

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx site/ /usr/share/nginx/html/


EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
