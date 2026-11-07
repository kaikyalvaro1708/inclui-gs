# Inclui+ — site estático servido pelo nginx.
# Sem etapa de build: a imagem só copia a pasta site/ e a configuração do servidor.

# Variante "unprivileged" da imagem oficial do nginx: já vem preparada para rodar sem
# root, ouvindo na porta 8080. A versão fica fixada para o build ser reproduzível.
FROM nginxinc/nginx-unprivileged:1.28-alpine

LABEL org.opencontainers.image.title="Inclui+" \
      org.opencontainers.image.description="Acessibilidade verificada por necessidade - FIAP Global Solution 2026.2"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx site/ /usr/share/nginx/html/

# Explícito, embora a imagem base já defina: o container nunca roda como root.
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
